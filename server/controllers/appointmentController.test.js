jest.mock('../models/Appointment', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../models/Chat', () => ({
  findOne: jest.fn()
}));

jest.mock('../models/Expert', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../models/ExpertSlot', () => ({
  findOne: jest.fn()
}));

jest.mock('../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../services/emailService', () => ({
  sendAppointmentBooked: jest.fn(() => Promise.resolve()),
  sendAppointmentRequestToExpert: jest.fn(() => Promise.resolve()),
  sendAppointmentConfirmed: jest.fn(() => Promise.resolve())
}));

const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
const Expert = require('../models/Expert');
const ExpertSlot = require('../models/ExpertSlot');
const User = require('../models/User');
const {
  bookAppointment,
  acceptAppointment,
  rejectAppointment,
  submitAppointmentConclusion,
  completeAppointment
} = require('./appointmentController');

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

describe('bookAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a pending booking and marks expert slot as booked', async () => {
    const req = {
      body: {
        expertId: 'expert-profile-1',
        date: '2030-05-10',
        slot: '10:00',
        consultationType: 'chat'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    const expertUser = { _id: 'expert-user-1', name: 'Dr Expert', email: 'expert@test.com' };
    const expertProfile = {
      userId: expertUser,
      verification: { status: 'approved' },
      status: { isActive: true, isSuspended: false },
      consultation: { fee: 200, availableSlots: [] }
    };
    const farmer = { _id: 'farmer-1', role: 'farmer', name: 'Farmer One' };
    const slotRecord = {
      status: 'available',
      appointmentId: null,
      save: jest.fn().mockResolvedValue(true)
    };
    const createdAppointment = {
      _id: 'appointment-1',
      farmerId: 'farmer-1',
      expertId: 'expert-user-1',
      confirmationToken: 'token-1',
      appointmentDetails: { date: new Date('2030-05-10'), startTime: '10:00' },
      payment: { amount: 200 },
      status: 'pending'
    };

    Expert.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(expertProfile)
    });
    farmer.followingExperts = ['expert-user-1'];
    User.findById.mockResolvedValue(farmer);
    ExpertSlot.findOne.mockResolvedValue(slotRecord);
    Appointment.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    Appointment.create.mockResolvedValue(createdAppointment);

    await bookAppointment(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        farmerId: 'farmer-1',
        expertId: 'expert-user-1',
        status: 'pending',
        appointmentDetails: expect.objectContaining({
          startTime: '10:00'
        })
      })
    );
    expect(slotRecord.status).toBe('booked');
    expect(slotRecord.appointmentId).toBe('appointment-1');
    expect(slotRecord.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.payload.data.status).toBe('pending');
  });

  test('blocks duplicate booking for the same farmer and slot', async () => {
    const req = {
      body: {
        expertId: 'expert-profile-1',
        date: '2030-05-10',
        timeSlot: '10:00'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    const expertProfile = {
      userId: { _id: 'expert-user-1', name: 'Dr Expert', email: 'expert@test.com' },
      verification: { status: 'approved' },
      status: { isActive: true, isSuspended: false },
      consultation: { fee: 0, availableSlots: [] }
    };

    Expert.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(expertProfile)
    });
    User.findById.mockResolvedValue({ _id: 'farmer-1', role: 'farmer', followingExperts: ['expert-user-1'] });
    ExpertSlot.findOne.mockResolvedValue(null);
    Appointment.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: 'existing-appointment' });

    await bookAppointment(req, res, next);

    expect(Appointment.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Duplicate booking is not allowed for the same farmer and slot');
  });

  test('blocks booking when farmer has not followed the expert', async () => {
    const req = {
      body: {
        expertId: 'expert-profile-1',
        date: '2030-05-10',
        slot: '10:00'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    const expertProfile = {
      userId: { _id: 'expert-user-1', name: 'Dr Expert', email: 'expert@test.com' },
      verification: { status: 'approved' },
      status: { isActive: true, isSuspended: false },
      consultation: { fee: 0, availableSlots: [] }
    };

    Expert.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(expertProfile)
    });
    User.findById.mockResolvedValue({ _id: 'farmer-1', role: 'farmer', followingExperts: [] });

    await bookAppointment(req, res, next);

    expect(Appointment.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Follow the expert before booking an appointment');
  });
});

describe('appointment decision actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('expert can accept a pending appointment', async () => {
    const req = {
      params: { id: 'appointment-1' },
      user: { id: 'expert-user-1', role: 'expert' }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      expertId: { toString: () => 'expert-user-1' },
      farmerId: 'farmer-1',
      status: 'pending',
      expertResponse: {},
      save: jest.fn().mockResolvedValue(true)
    };

    Appointment.findById.mockResolvedValue(appointment);
    User.findById
      .mockResolvedValueOnce({ _id: 'farmer-1' })
      .mockResolvedValueOnce({ _id: 'expert-user-1' });

    await acceptAppointment(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.status).toBe('accepted');
    expect(appointment.expertResponse.responseStatus).toBe('accepted');
    expect(appointment.save).toHaveBeenCalled();
    expect(res.payload.message).toBe('Appointment accepted!');
  });

  test('non-expert cannot accept appointment', async () => {
    const req = {
      params: { id: 'appointment-1' },
      user: { id: 'farmer-1', role: 'farmer' }
    };
    const res = createResponse();
    const next = jest.fn();

    Appointment.findById.mockResolvedValue({
      expertId: { toString: () => 'expert-user-1' },
      status: 'pending'
    });

    await acceptAppointment(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Only expert can accept appointments');
  });

  test('expert can reject a pending appointment and free the slot', async () => {
    const req = {
      params: { id: 'appointment-1' },
      body: { reason: 'Unavailable' },
      user: { id: 'expert-user-1', role: 'expert' }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      expertId: { toString: () => 'expert-user-1' },
      appointmentDetails: {
        date: new Date('2030-05-10'),
        startTime: '10:00'
      },
      status: 'pending',
      expertResponse: {},
      cancellation: {},
      save: jest.fn().mockResolvedValue(true)
    };
    const slotRecord = {
      status: 'booked',
      appointmentId: 'appointment-1',
      save: jest.fn().mockResolvedValue(true)
    };

    Appointment.findById.mockResolvedValue(appointment);
    ExpertSlot.findOne.mockResolvedValue(slotRecord);

    await rejectAppointment(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.status).toBe('rejected');
    expect(appointment.expertResponse.responseStatus).toBe('declined');
    expect(slotRecord.status).toBe('available');
    expect(slotRecord.appointmentId).toBe(null);
    expect(slotRecord.save).toHaveBeenCalled();
    expect(res.payload.message).toBe('Appointment rejected');
  });

  test('expert can submit consultation conclusion', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        diagnosis: 'Powdery mildew risk observed',
        recommendation: 'Apply the recommended fungicide and reduce overhead watering',
        notes: 'Monitor leaves for 7 days'
      },
      user: {
        id: 'expert-user-1',
        role: 'expert'
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      expertId: { toString: () => 'expert-user-1' },
      status: 'active',
      conclusion: {},
      save: jest.fn().mockResolvedValue(true)
    };

    Appointment.findById.mockResolvedValue(appointment);

    await submitAppointmentConclusion(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.conclusion.diagnosis).toBe('Powdery mildew risk observed');
    expect(appointment.conclusion.recommendation).toContain('fungicide');
    expect(appointment.conclusion.notes).toBe('Monitor leaves for 7 days');
    expect(appointment.conclusion.submittedBy).toBe('expert-user-1');
    expect(appointment.conclusion.submittedAt).toBeInstanceOf(Date);
    expect(appointment.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.payload.message).toBe('Appointment conclusion submitted successfully');
  });

  test('farmer cannot submit consultation conclusion', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        diagnosis: 'Diagnosis',
        recommendation: 'Recommendation'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    Appointment.findById.mockResolvedValue({
      expertId: { toString: () => 'expert-user-1' },
      status: 'active'
    });

    await submitAppointmentConclusion(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Only expert can submit conclusion');
  });

  test('cannot complete appointment without expert messages', async () => {
    const req = {
      params: { id: 'appointment-1' },
      user: { id: 'expert-user-1', role: 'expert' }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      _id: 'appointment-1',
      expertId: { toString: () => 'expert-user-1' },
      status: 'active',
      conclusion: {
        diagnosis: 'Diagnosis',
        recommendation: 'Recommendation'
      },
      consultation: {},
      save: jest.fn()
    };

    Appointment.findById.mockResolvedValue(appointment);
    Chat.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    await completeAppointment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(appointment.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Cannot complete appointment without expert messages');
  });

  test('cannot complete appointment without conclusion', async () => {
    const req = {
      params: { id: 'appointment-1' },
      user: { id: 'expert-user-1', role: 'expert' }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      _id: 'appointment-1',
      expertId: { toString: () => 'expert-user-1' },
      status: 'active',
      conclusion: {
        diagnosis: '',
        recommendation: ''
      },
      consultation: {},
      save: jest.fn()
    };

    Appointment.findById.mockResolvedValue(appointment);
    Chat.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'message-1' })
    });

    await completeAppointment(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(appointment.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Cannot complete appointment without conclusion');
  });

  test('expert can complete appointment when messages and conclusion exist', async () => {
    const req = {
      params: { id: 'appointment-1' },
      user: { id: 'expert-user-1', role: 'expert' }
    };
    const res = createResponse();
    const next = jest.fn();
    const appointment = {
      _id: 'appointment-1',
      expertId: { toString: () => 'expert-user-1' },
      status: 'active',
      conclusion: {
        diagnosis: 'Diagnosis',
        recommendation: 'Recommendation'
      },
      consultation: {
        startTime: new Date(Date.now() - 30 * 60000)
      },
      save: jest.fn().mockResolvedValue(true)
    };

    Appointment.findById.mockResolvedValue(appointment);
    Chat.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'message-1', senderRole: 'expert' })
    });
    Expert.findOneAndUpdate = jest.fn().mockResolvedValue(true);

    await completeAppointment(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.status).toBe('completed');
    expect(appointment.consultation.endTime).toBeInstanceOf(Date);
    expect(typeof appointment.consultation.actualDuration).toBe('number');
    expect(appointment.save).toHaveBeenCalled();
    expect(Expert.findOneAndUpdate).toHaveBeenCalled();
    expect(res.payload.message).toBe('Consultation completed!');
  });
});
